import { Request, Response } from "express"
import prisma from "../db/client.ts"
// import { redisClient } from "../redisClient.ts";

export const createTracks = async (req: Request, res: Response) => {
    try {
        const tracksData = req.body;

        // MANEJO DE MÚLTIPLES PISTAS: VERIFICA QUE SE HAYAN PROPORCIONADO DATOS DE LAS PISTAS
        if (!Array.isArray(tracksData) || tracksData.length === 0) {
            return res.status(400).json({ message: 'No tracks data provided' });
        }

        const createdTracks = [];

        // ITERACIÓN SOBRE CADA OBJETO DE CANCIÓN EN EL ARRAY DE DATOS
        for (const trackData of tracksData) {
            const { name, artistId, url, thumbnail, genreName, albumId } = trackData;

            // BUSCA EL GÉNERO
            const genre = await prisma.genre.findUnique({
                where: { name: genreName }
            });

            if (!genre) {
                return res.status(404).json({ message: 'Genre not found' });
            }

            // CREA LA PISTA
            const newTrack = await prisma.tracks.create({
                data: {
                    name,
                    url,
                    thumbnail,
                    genreName,
                }
            });

            // ASOCIA LA PISTA CON EL ARTISTA
            const artist = await prisma.artists.findUnique({
                where: { id: artistId }
            });

            if (!artist) {
                return res.status(404).json({ message: 'Artist not found' });
            }

            await prisma.artistsOnTracks.create({
                data: {
                    artistId,
                    trackId: newTrack.id
                }
            });

            // ASOCIA LA PISTA CON EL ÁLBUM
            const album = await prisma.albums.findUnique({
                where: { id: albumId }
            });

            if (!album) {
                return res.status(404).json({ message: 'Album not found' });
            }

            await prisma.tracksOnAlbums.create({
                data: {
                    albumId,
                    trackId: newTrack.id
                }
            });

            createdTracks.push(newTrack);
        }

        // RESPUESTA CON TODAS LAS PISTAS CREADAS
        res.status(201).json(createdTracks);

    } catch (error) {
        console.error('Error creating tracks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getAllTracks = async (req: Request, res: Response) => {
    try {
        // const tracksInRedis = await redisClient.get('allTracks');
        // if (tracksInRedis) {
        //     return res.status(200).send(JSON.parse(tracksInRedis));
        // }
        const allTracks = await prisma.tracks.findMany()
        if (!allTracks || allTracks?.length === 0) {
            res.status(404).json({ message: "No tracks have been found" })
        }

        // try {
        //     await redisClient.set('allTracks', JSON.stringify(allTracks));
        //     await redisClient.expire('allTracks', 60 * 60 * 8);
        // } catch (error) {
        //     console.log(error)
        // }

        res.status(200).send(allTracks)
    } catch (error) {
        res.status(503).json(`Internal server error: ${error}`)
    }
};

export const getAllTracksByArtist = async (req: Request, res: Response) => {
    const artistId = req.params.artistId;

    try {
        const artist = await prisma.artists.findUnique({
            where: { id: artistId }
        });

        if (!artist) {
            return res.status(404).json({ message: `Artist with id ${artistId} not found` });
        }

        const tracks = await prisma.tracks.findMany({
            where: {
                artist: {
                    some: {
                        artistId: artistId
                    }
                }
            }
        });

        if (tracks.length === 0) {
            res.status(404).json({ message: "No tracks have been found" })
        }

        res.status(200).json(tracks);
    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getTrack = async (req: Request, res: Response) => {
    const { trackId } = req.params

    try {
        const selectedTrack = await prisma.tracks.findUnique({
            where: {
                id: trackId
            }
        })
        if (!selectedTrack) {
            res.status(404).json({ message: "The track has not been found" })
        }
        res.status(200).send(selectedTrack)
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
};

export const updateTracks = async (req: Request, res: Response) => {
    const { name, artistId, url, thumbnail, genreName, albumId } = req.body;
    const { trackId } = req.params;

    try {
        const updatedTrack = await prisma.tracks.update({
            where: {
                id: trackId
            },
            data: {
                name,
                url,
                thumbnail,
                genreName,
                album: albumId,
                artist: artistId
            },
        })

        res.status(200).json(updatedTrack)

    } catch (error) {
        console.error('Error updating track:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
};

export const deleteTracks = async (req: Request, res: Response) => {
    const { trackId } = req.params

    try {
        const track = await prisma.tracks.findUnique({
            where: { id: trackId },
        });

        if (!track) {
            return res.status(404).json({ message: `Track with ID ${trackId} not found` });
        }

        await prisma.artistsOnTracks.deleteMany({
            where: { trackId },
        });

        await prisma.tracksOnAlbums.deleteMany({
            where: { trackId },
        });

        await prisma.tracks.delete({
            where: { id: trackId },
        });

        res.status(201).json({ message: "Track deleted successfully" })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}
