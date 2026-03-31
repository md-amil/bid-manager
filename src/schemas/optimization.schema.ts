// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// export type OptimizationLogDocument = OptimizationLog & Document;

// @Schema({ timestamps: true })
// export class OptimizationLog {
//     @Prop({ required: true })
//     entityType: 'CAMPAIGN' | 'AD_GROUP' | 'KEYWORD'

//     @Prop({ required: true })
//     entityId: string

//     @Prop({ required: true })
//     type: 'BID_UPDATE' | 'BUDGET_UPDATE'  


//     @Prop({ required: false })
//     oldValue: number;

//     @Prop({ required: false })
//     newValue: number;

//      @Prop({ required: false })
//     action: string;

//     @Prop({ required: false })
//     utilization:number

//     @Prop({ required: false })
//     adjustmentPercentage: number;

//     @Prop({ default: 'success' })
//     status: string;
    
//     @Prop()
//     errorMessage: string;

//     @Prop({ required: true })
//     reason: string;
// }

// export const OptimizationLogSchema = SchemaFactory.createForClass(OptimizationLog);
