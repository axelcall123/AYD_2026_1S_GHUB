import { prisma } from "../../db/prisma.js";
import { CreateUserDTO } from "./user.types.js";

export class UserService {
  async findAll() {
    return prisma.user.findMany();
  }

  async create(data: CreateUserDTO) {
    return prisma.user.create({
      data,
    });
  }
}
