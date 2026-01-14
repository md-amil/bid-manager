import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Profile extends Document {
    @Prop({ required: true, unique: true })
    profileId: string;

    @Prop({ required: true })
    sellerName: string;

    @Prop({ required: true, unique: true })
    marketplaceId: string;
}

export const UserSchema = SchemaFactory.createForClass(Profile);