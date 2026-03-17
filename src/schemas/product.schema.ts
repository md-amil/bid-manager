import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class PriceToPay {
  @Prop({ type: Number })
  amount: number;

  @Prop({ type: String })
  currency: string;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true, index: true })
  asin: string;

  @Prop({ index: true })
  profileId: string;

  @Prop()
  availability: string;

  @Prop()
  bestSellerRank: string;

  @Prop()
  brand: string;

  @Prop()
  category: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: PriceToPay })
  priceToPay: PriceToPay;

  @Prop()
  sku: string;

  @Prop()
  title: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
