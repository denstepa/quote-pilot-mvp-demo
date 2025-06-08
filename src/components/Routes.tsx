import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Route, Loader2 } from "lucide-react";
import type { RouteOption, RouteSegment, Request } from "@prisma/client";
import { RouteOption as RouteOptionComponent } from "./RouteOption";

// Extended type to include segments for RouteOption
type RouteOptionWithSegments = RouteOption & {
  segments: RouteSegment[];
};

interface RoutesProps {
  request: Request;
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

export function Routes({ request }: RoutesProps) {
  const [routeOptions, setRouteOptions] = useState<RouteOptionWithSegments[] | undefined>(undefined);
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [calculatingPrices, setCalculatingPrices] = useState<Record<string, boolean>>({});

  // Load existing routes when component mounts
  useEffect(() => {
    loadExistingRoutes();
  }, [request.id]);

  const loadExistingRoutes = async () => {
    setLoadingRoutes(true);
    setRouteError(null);
    try {
      const response = await fetch(`/api/requests/${request.id}/routes`);
      if (response.ok) {
        const data = await response.json();
        setRouteOptions(data.routes);
      } else {
        // If routes don't exist, that's not an error - just means no routes calculated yet
        setRouteOptions([]);
      }
    } catch {
      // If fetching fails, just set empty array - not a critical error
      setRouteOptions([]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const calculateRoutes = async () => {
    setCalculatingRoutes(true);
    setRouteError(null);
    try {
      const response = await fetch(`/api/requests/${request.id}/calculate-routes`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to calculate routes');
      }
      const routes = await response.json();
      setRouteOptions(routes);
    } catch {
      setRouteError('Failed to calculate routes. Please try again.');
    } finally {
      setCalculatingRoutes(false);
    }
  };

  const calculateRoutePrice = async (routeId: string) => {
    setCalculatingPrices(prev => ({ ...prev, [routeId]: true }));
    try {
      const response = await fetch(`/api/requests/${request.id}/routes/${routeId}/calculate-price`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate price');
      }

      const updatedRoute = await response.json();
      setRouteOptions(prev => 
        prev?.map(route => 
          route.id === routeId ? { ...route, ...updatedRoute } : route
        )
      );
    } catch {
      setRouteError('Failed to calculate price. Please try again.');
    } finally {
      setCalculatingPrices(prev => ({ ...prev, [routeId]: false }));
    }
  };

  if (loadingRoutes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Available Routes
          </CardTitle>
          <CardDescription>
            Calculate and view available transport routes for this request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading routes...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Available Routes
        </CardTitle>
        <CardDescription>
          Calculate and view available transport routes for this request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={calculateRoutes} 
          disabled={calculatingRoutes}
          className="w-full"
        >
          {calculatingRoutes ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating Routes...
            </>
          ) : (
            <>
              <Route className="h-4 w-4 mr-2" />
              {routeOptions && routeOptions.length > 0 ? 'Recalculate Routes' : 'Calculate Routes'}
            </>
          )}
        </Button>

        {routeError && (
          <Alert variant="destructive">
            <AlertDescription>{routeError}</AlertDescription>
          </Alert>
        )}

        {routeOptions && routeOptions.length > 0 ? (
          <div className="space-y-6">
            {routeOptions.map((route) => (
              <RouteOptionComponent
                key={route.id}
                route={route}
                onCalculatePrice={calculateRoutePrice}
                isCalculatingPrice={calculatingPrices[route.id]}
              />
            ))}
          </div>
        ) : routeOptions ? (
          <div className="text-center py-4 text-gray-500">
            No routes found for this request.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default Routes; 