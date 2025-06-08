import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RouteOption, RouteSegment } from "@prisma/client";
import { Route, Truck, Plane, ArrowRight, MapPin, Calculator, Loader2, Clock, Calendar, Trophy, Zap } from "lucide-react";
import { format } from "date-fns";

type RouteOptionWithSegments = RouteOption & {
  segments: RouteSegment[];
};

interface RouteOptionProps {
  route: RouteOptionWithSegments;
  onCalculatePrice: (routeId: string) => Promise<void>;
  isCalculatingPrice: boolean;
  isCheapest?: boolean;
  isFastest?: boolean;
}

const getSegmentIcon = (type: string) => {
  switch (type) {
    case 'TRUCKING':
      return <Truck className="h-4 w-4" />;
    case 'AIR':
      return <Plane className="h-4 w-4" />;
    default:
      return <Route className="h-4 w-4" />;
  }
};

const getSegmentColor = (type: string) => {
  switch (type) {
    case 'TRUCKING':
      return 'bg-blue-100 text-blue-800';
    case 'AIR':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function RouteOption({ route, onCalculatePrice, isCalculatingPrice, isCheapest = false, isFastest = false }: RouteOptionProps) {
  const getCardStyling = () => {
    if (isCheapest) {
      return 'border-green-300 bg-green-50';
    }
    if (isFastest) {
      return 'border-blue-300 bg-blue-50';
    }
    return '';
  };

  return (
    <Card className={`border-2 ${getCardStyling()}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {route.status.toLowerCase()}
              </Badge>
              {isCheapest && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Trophy className="h-3 w-3 mr-1" />
                  Cheapest
                </Badge>
              )}
              {isFastest && (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  <Zap className="h-3 w-3 mr-1" />
                  Fastest
                </Badge>
              )}
              {route.totalPrice && (
                <div className="text-sm font-medium">
                  {route.totalPrice.toFixed(2)} {route.currency}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCalculatePrice(route.id)}
              disabled={isCalculatingPrice}
            >
              {isCalculatingPrice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Price
                </>
              )}
            </Button>
          </div>

          {/* Route Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <div className="text-gray-500">Pickup</div>
                <div className="font-medium">
                  {route.pickupAt ? format(new Date(route.pickupAt), 'MMM d, HH:mm') : '-'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <div className="text-gray-500">Delivery</div>
                <div className="font-medium">
                  {route.deliveryAt ? format(new Date(route.deliveryAt), 'MMM d, HH:mm') : '-'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <div className="text-gray-500">Duration</div>
                <div className="font-medium">
                  {route.duration ? `${Math.floor(route.duration)}h ${Math.round((route.duration % 1) * 60)}m` : '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-left py-2 px-4">Route</th>
                  <th className="text-left py-2 px-4">Airline</th>
                  <th className="text-left py-2 px-4">Departure</th>
                  <th className="text-left py-2 px-4">Arrival</th>
                  <th className="text-left py-2 px-4">Duration</th>
                  <th className="text-left py-2 px-4">Price</th>
                  <th className="text-right py-2 px-4">Distance</th>
                </tr>
              </thead>
              <tbody>
                {route.segments.map((segment) => (
                  <tr key={segment.id} className="border-b">
                    <td className="py-2 px-4">
                      <Badge variant="secondary" className={`capitalize ${getSegmentColor(segment.segmentType)}`}>
                        {getSegmentIcon(segment.segmentType)}
                        <span className="ml-1">{segment.segmentType.toLowerCase()}</span>
                      </Badge>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>
                            {segment.segmentType === 'AIR' && segment.originAirportCode ? (
                              <Badge variant="secondary" className="font-mono bg-sky-100 text-sky-800 hover:bg-sky-100">
                                {segment.originAirportCode}
                              </Badge>
                            ) : null}
                            <span className="ml-1">{segment.originName}</span>
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>
                            {segment.segmentType === 'AIR' && segment.destinationAirportCode ? (
                              <Badge variant="secondary" className="font-mono bg-sky-100 text-sky-800 hover:bg-sky-100">
                                {segment.destinationAirportCode}
                              </Badge>
                            ) : null}
                            <span className="ml-1">{segment.destinationName}</span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      {segment.segmentType === 'AIR' && segment.airline && (
                        <Badge variant="outline" className="text-xs">
                          {segment.airline}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {segment.departureTime ? format(new Date(segment.departureTime), 'MMM d, HH:mm') : '-'}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {segment.arrivalTime ? format(new Date(segment.arrivalTime), 'MMM d, HH:mm') : '-'}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {segment.duration ? `${Math.floor(segment.duration)}h ${Math.round((segment.duration % 1) * 60)}m` : '-'}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {segment.price ? `${segment.price.toFixed(2)} ${route.currency}` : '-'}
                    </td>
                    <td className="py-2 px-4 text-sm text-right">
                      {segment.distance ? `${segment.distance.toFixed(1)} km` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={5} className="py-2 px-4 text-sm text-gray-500">
                    Total Duration: {route.estimatedDuration ? `${Math.floor(route.estimatedDuration)}h ${Math.round((route.estimatedDuration % 1) * 60)}m` : '-'}
                  </td>
                  <td colSpan={2} className="py-2 px-4 text-sm font-medium">
                    Total Price: {route.totalPrice ? `${route.totalPrice.toFixed(2)} ${route.currency}` : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 