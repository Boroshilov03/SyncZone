// src/utils/validation.js
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export const signupSchema = z
  .object({
    username: z.string().min(5, "Username must be at least 5 characters long"),
    firstname: z.string().nonempty("First Name is required"),
    lastname: z.string().nonempty("Last Name is required"),
    email: z.string().email("Invalid email address"),
    password1: z.string().min(8, "Password must be at least 8 characters long"),
    password2: z.string().min(8, "Password must be at least 8 characters long"),
    location: z.string().optional(),
    latitude: z.string().optional(), // Make location optional
    longitude: z.string().optional(), // Make location optional
  })
  .refine((data) => data.password1 === data.password2, {
    message: "Passwords do not match",
    path: ["password2"],
  });
