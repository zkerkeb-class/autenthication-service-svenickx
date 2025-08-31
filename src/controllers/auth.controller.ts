import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user";
import { fetchApi } from "../services/fetch.service";

export default class AuthController {
  constructor() {}

  register = async (req: Request, res: Response) => {
    const { firstname, lastname, email, password } = req.body;

    const u = await fetchApi<IUser>(
      `${process.env.DB_SERVICE_URL}auth/createUser`,
      "post",
      {
        email,
        firstname,
        lastname,
        emailVerified: false,
        password,
      }
    );
    if (!u.success) {
      res.status(u.code).json({});
      return;
    }
    const user = u.data.data;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.cookie("access-token", token, {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      signed: false,
    });

    res.status(200).json({});
    return;
  };

  login = async (req: Request, res: Response) => {
    const { email } = req.body;

    const getUserResponse = await fetchApi(
      `${process.env.DB_SERVICE_URL}auth/getUserByEmail/${email}`,
      "get"
    );

    if (!getUserResponse.success) {
      res.status(400).json({});
      return;
    }

    const user = getUserResponse.data.data;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.cookie("access-token", token, {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      signed: false,
    });

    res.status(200).json({});
    return;
  };
}
