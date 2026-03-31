import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  label: string;

  @Prop()
  description: string;

  @Prop({ default: 0 })
  min: number;

  @Prop({ default: 10000 })
  max: number;

  @Prop({ default: 0.01 })
  step: number;

  @Prop({ default: 'number' })
  type: 'number' | 'percent' | 'currency';

  @Prop({ default: 'general' })
  category: 'general' | 'thresholds' | 'targeting';
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

// Compound index to ensure unique key per organization
SettingSchema.index({ key: 1, organizationId: 1 }, { unique: true });
