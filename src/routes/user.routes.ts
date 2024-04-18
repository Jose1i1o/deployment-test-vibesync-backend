import { Router } from "express"
import { createAccount, getAccounts } from "../controllers/user.controller.ts"


const userRoutes = Router ()

userRoutes.get("/account", getAccounts)
userRoutes.post("/account", createAccount)

export default userRoutes