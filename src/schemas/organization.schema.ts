import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Organization extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    phone: string

    @Prop({ required: false })
    refreshToken?: string

    @Prop({ required: false })
    password:string

}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);