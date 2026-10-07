import { Model } from 'mongoose';
import { IUser, IUserMethods } from '../interfaces/interfaces';

export type userRoleType = 'READER' | 'AUTHOR' | 'ADMIN';

export type themeType = 'Default';

export type languageType = 'English';

export type UserModel = Model<IUser, {}, IUserMethods>;
