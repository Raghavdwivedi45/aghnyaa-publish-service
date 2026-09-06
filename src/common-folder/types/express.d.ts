import { AuthPayload } from "../interfaces/interfaces";


declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {}; // makes the file a module so the global augmentation is applied correctly.