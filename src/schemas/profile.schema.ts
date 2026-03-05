import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({ timestamps: false, _id: false })
export class AccountInfo {
    @Prop({ required: false })
    marketplaceStringId: string;

    @Prop({ required: false })
    id: string;

    @Prop({
        type: String,
        enum: ['seller', 'vendor', 'agency'],
        default: 'seller',
    })
    type: string

    @Prop({ required: false })
    name: string;
}


@Schema({ timestamps: true })
export class Profile extends Document {
    @Prop({ required: true, unique: true })
    profileId: string;

    @Prop({ required: true })
    organizationId: string

    @Prop({ required: true })
    countryCode: string

    @Prop({ required: true })
    currencyCode: string

    @Prop({ required: true, default: 0 })
    dailyBudget: number

    @Prop({ required: false })
    timezone: string

    @Prop({ type: AccountInfo, required: true })
    accountInfo: AccountInfo
}


export const ProfileSchema = SchemaFactory.createForClass(Profile);