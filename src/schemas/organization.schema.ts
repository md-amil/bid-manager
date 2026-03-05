import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Organization extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: false })
    refreshToken?: string

    // @Prop({ required: false })
    // accessToken?: string

    // @Prop({ required: false })
    // accessTokenExpires?: Date

    @Prop({ required: true })
    ownerId: string

}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);