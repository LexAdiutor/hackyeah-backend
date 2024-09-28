import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

    async findByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async isAnyUserWithEmail(email: string) {
        return !!(await this.findByEmail(email));
    }

    async create(name: string, email: string, password: string): Promise<User | null> {
        try {
            return (new this.userModel({ name, email, password })).save();
        } catch {
            return null;
        }
    }

    async update(id: string, obj: Partial<User>): Promise<User | null> {
        const user = await this.userModel.findById(id);

        if (!user) {
            return null;
        }

        Object.assign(user, obj);

        try {
            return await user.save();
        } catch {
            return null;
        }
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel.findById(id).select('-password').exec();
    }
}
