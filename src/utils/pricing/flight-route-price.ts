import { AirlineRate, AirportRate,  RouteSegment, Request, ScheduledFlight } from "@prisma/client";
import prisma from "../../libs/prisma";
import { convertToEur, SupportedCurrency } from "../../utils/currency";

export const calculateFlightPrice = async (flight: ScheduledFlight, routeSegment: RouteSegment, request: Request): Promise<number> => {

  const originAirportRate: AirportRate = await prisma.airportRate.findFirstOrThrow({  
    where: {
      stationCode: routeSegment.originAirportCode!,
      airline: flight.airline,
      serviceType: 'Export',
    },
  });

  const destinationAirportRate: AirportRate = await prisma.airportRate.findFirstOrThrow({
    where: {
      stationCode: routeSegment.destinationAirportCode!,
      airline: flight.airline,
      serviceType: 'Import',
    },
  });

  const airlineRate: AirlineRate = await prisma.airlineRate.findFirstOrThrow({
    where: {
      stationCode: routeSegment.originAirportCode!,
      originCountryCode: routeSegment.originCountryCode!,
      destinationCountryCode: routeSegment.destinationCountryCode!,
    },
  });

  const originAirportHandlingFee = (originAirportRate.exportHandling ?? 0) + (originAirportRate.exportCustoms ?? 0);
  const originAirportCurrency = originAirportRate.currency as SupportedCurrency;
  const destinationAirportHandlingFee = (destinationAirportRate.importHandling ?? 0) + (destinationAirportRate.importCustoms ?? 0);
  const destinationAirportCurrency = destinationAirportRate.currency as SupportedCurrency;

  const airlineCurrency = airlineRate.currency as SupportedCurrency;
  const cargoWeight = request.weight!;

  const weightPrice = calculateWeightPrice(airlineRate, cargoWeight);

  const totalPrice = convertToEur(weightPrice, airlineCurrency) + convertToEur(originAirportHandlingFee, originAirportCurrency) + convertToEur(destinationAirportHandlingFee, destinationAirportCurrency);
  return totalPrice;
}

export const calculateWeightPrice = (airlineRate: AirlineRate, cargoWeight: number): number => {
  const fuelCharge = airlineRate.fuelChargePerKg * cargoWeight;
  const basePrice = airlineRate.basePrice;
  let weightPrice = 0;
  if (cargoWeight <= 45 && airlineRate.priceUnder45kg) weightPrice = airlineRate.priceUnder45kg * cargoWeight;
  if (cargoWeight <= 100 && airlineRate.priceUnder100kg) weightPrice = airlineRate.priceUnder100kg * cargoWeight;
  if (cargoWeight <= 250 && airlineRate.priceUnder250kg) weightPrice = airlineRate.priceUnder250kg * cargoWeight;
  if (cargoWeight <= 300 && airlineRate.priceUnder300kg) weightPrice = airlineRate.priceUnder300kg * cargoWeight;
  if (cargoWeight <= 500 && airlineRate.priceUnder500kg) weightPrice = airlineRate.priceUnder500kg * cargoWeight;
  if (cargoWeight <= 1000 && airlineRate.priceUnder1000kg) weightPrice = airlineRate.priceUnder1000kg * cargoWeight;
  return weightPrice + fuelCharge + basePrice;
}