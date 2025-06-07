import { Field, ObjectType } from "@nestjs/graphql";
import { Vehicle } from "src/vehicles/entities/vehicle.entity";

@ObjectType()
export class VehicleResponse{
    @Field(() => Vehicle)
    vehicle: Vehicle; 
}

@ObjectType()
export class VehiclesResponse{
    @Field(() => [Vehicle])
    vehicles: Vehicle[];
}