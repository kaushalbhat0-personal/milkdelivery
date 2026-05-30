export type OptimizeRouteInput = {
  driverLatitude: number;
  driverLongitude: number;
};

export type OptimizedStop = {
  id: string;
  customerName: string;
  customerAddress: string;
  latitude: number;
  longitude: number;
  distanceFromPrevious: number;
};

export type OptimizeRouteResult = {
  optimizedStops: OptimizedStop[];
  totalDistance: number;
  stopsWithoutCoords: { id: string; name: string }[];
};
