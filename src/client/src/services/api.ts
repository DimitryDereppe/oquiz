import type { LoginData } from "../lib/login-data";
import type { RegisterData } from "../lib/register-data";

import { requester } from "../lib/utils";

export const api = {
  login, refresh, logout, register, getUsers
};

export interface UserDTO {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

async function getUsers(): Promise<Array<UserDTO>> {
  return (await requester.get('/users')).data;
}

async function login(data: LoginData): Promise<boolean> {

  const response = await requester.post("/auth/login", data);

  return 200 == response.status;
}

async function refresh(): Promise<boolean> {

  const response = await requester.post("/auth/refresh");

  return 200 == response.status;
}

async function logout(): Promise<boolean> {

  const response = await requester.post("/auth/logout");

  return 204 == response.status;
}

async function register(data: RegisterData): Promise<boolean> {

  const response = await requester.post("/auth/register", data);

  return 201 == response.status;
}