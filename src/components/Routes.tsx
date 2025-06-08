"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Route, Loader2 } from "lucide-react";
import type { RouteOption, RouteSegment } from "@prisma/client";
import { RouteOption as RouteOptionComponent } from "./RouteOption";
import { RequestWithRouteOptions } from "../../types";

type RouteOptionWithSegments = RouteOption & {
  segments: RouteSegment[];
};

interface RoutesProps {
  request: RequestWithRouteOptions;
}

export function Routes({ request }: RoutesProps) {
  const [routeOptions, setRouteOptions] = useState<RouteOptionWithSegments[] | undefined>(request.routeOptions);
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [calculatingPrices, setCalculatingPrices] = useState<Record<string, boolean>>({});
  const [cheapestRouteId, setCheapestRouteId] = useState<string | null>(request.cheapestRouteId);
  const [fastestRouteId, setFastestRouteId] = useState<string | null>(request.fastestRouteId);

  useEffect(() => {
    setRouteOptions(request.routeOptions);
    setCheapestRouteId(request.cheapestRouteId);
    setFastestRouteId(request.fastestRouteId);
  }, [request.routeOptions, request.cheapestRouteId, request.fastestRouteId]);

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
      const updatedRequest = await response.json();
      
      setRouteOptions(updatedRequest.routeOptions);
      setCheapestRouteId(updatedRequest.cheapestRouteId);
      setFastestRouteId(updatedRequest.fastestRouteId);
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

  if (calculatingRoutes) {
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
              Calculating routes...
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
            {routeOptions
              .slice()
              .sort((a, b) => {
                // Cheapest route comes first
                if (a.id === cheapestRouteId) return -1;
                if (b.id === cheapestRouteId) return 1;
                
                // Fastest route comes second
                if (a.id === fastestRouteId) return -1;
                if (b.id === fastestRouteId) return 1;
                
                // Keep original order for the rest
                return 0;
              })
              .map((route) => (
                <RouteOptionComponent
                  key={route.id}
                  route={route}
                  onCalculatePrice={calculateRoutePrice}
                  isCalculatingPrice={calculatingPrices[route.id]}
                  isCheapest={route.id === cheapestRouteId}
                  isFastest={route.id === fastestRouteId}
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