import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";

const service = new UserService();

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await service.findAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await service.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
}
