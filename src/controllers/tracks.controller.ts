import { Request, Response } from "express"
import prisma from "../db/client.ts"

export const createTracks = async (req:Request, res:Response) => {
    const { name, artistId, url, thumbnail, genreId, albumId} = req.body

    try { const newTrack = await prisma.tracks.create({ 
        data:{ 
            name, 
            artistId, 
            url, 
            thumbnail, 
            genreId,
            albumId
        }})
        const artist = await prisma.artists.findUnique({
            where: {
                id: artistId
            }
        });

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const album = await prisma.albums.findUnique({
            where: {
                id: albumId
            }
        });

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        const genre = await prisma.genre.findUnique({
            where: {
                id: genreId
            }
        });

        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        const updatedArtist = await prisma.artists.update({
            where: {
                id: artistId
            },
            data: {
                tracks: {
                    connect: {
                        id: newTrack.id
                    }
                }
            }
        });

        const updatedAlbum = await prisma.albums.update({
            where: {
                id: albumId
            },
            data: {
                tracks: {
                    connect: {
                        id: newTrack.id
                    }
                }
            }
        });

        const updatedGenre = await prisma.genre.update({
            where: {
                id: genreId
            },
            data: {
                tracks: {
                    connect: {
                        id: newTrack.id
                    }
                }
            }
        })
        res.status(201).send(newTrack)
        
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
    }
}

export const getAllTracks = async (req:Request, res:Response) => {
    try { const allTracks = await prisma.tracks.findMany()
        if (!allTracks) {
            res.status(404).json({message: "No tracks have been found"})
        }
        res.status(200).send(allTracks)
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
    }
}

export const getTrack = async (req:Request, res:Response) => {
    const { trackId } = req.params

    try { const selectedTrack = await prisma.tracks.findUnique({
        where:{
            id:trackId
        }
    })
        if (!selectedTrack) {
            res.status(404).json({message: "The track has not been found"})
        }
        res.status(200).send(selectedTrack)
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
    }
}

export const updateTracks = async (req:Request, res:Response) => {
    const { name, artistId, url, thumbnail, genreId, albumId} = req.body
    const { trackId } = req.params

    try { const updatedTrack = await prisma.tracks.update({
            where: { id: trackId },
            data: { 
                name, 
                artistId, 
                url, 
                thumbnail, 
                genreId, 
                albumId }
        });

    
        await prisma.artists.update({
            where: { id: artistId },
            data: { 
                tracks: { 
                    connect: { id: trackId } 
                } }
            });


        await prisma.albums.update({
            where: { id: albumId },
            data: { 
                tracks: { 
                    connect: { id: trackId } 
                } }
            });

        await prisma.genre.update({
            where: { id: genreId },
            data: { 
                tracks: { 
                    connect: { id: trackId } 
                } }
            });

    res.status(201).send(updatedTrack);
        
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
    }
}

export const deleteTracks = async (req:Request, res:Response) => {
    const { trackId } = req.params

    try { const deletedTrack = await prisma.tracks.delete({
        where: {
            id:trackId
            }
        })
        await prisma.artists.update({
            where: { id: deletedTrack.artistId },
            data: {
                tracks: {
                    disconnect: { id: trackId }
                }
            }
        });

        await prisma.albums.update({
            where: { id: deletedTrack.albumId },
            data: {
                tracks: {
                    disconnect: { id: trackId }
                }
            }
        });

        await prisma.genre.update({
            where: { id: deletedTrack.genreId },
            data: {
                tracks: {
                    disconnect: { id: trackId }
                }
            }
        });
        res.status(201).json({message: "Track deleted successfully"})
        
    } catch (error) {
        res.status(500).json({message:"Internal server error"}) 
    }
}