import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeatherData {
  name: string;
  country: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  weatherMain: string;
  icon: string;
}

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Note: For production, you'll need to get your API key from OpenWeatherMap
  const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with actual API key
  const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

  const getWeatherEmoji = (weatherMain: string, icon: string) => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[icon] || '🌤️';
  };

  const getWeatherTheme = (weatherMain: string) => {
    const themes = {
      Clear: 'sunny',
      Clouds: 'cloudy',
      Rain: 'rainy',
      Drizzle: 'rainy',
      Thunderstorm: 'rainy',
      Snow: 'snowy',
      Mist: 'cloudy',
      Fog: 'cloudy',
      Haze: 'cloudy',
    };
    return themes[weatherMain as keyof typeof themes] || 'cloudy';
  };

  const fetchWeather = async (query: string, isCoordinates = false) => {
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
      setError('Please add your OpenWeatherMap API key to use the weather service.');
      toast({
        title: "API Key Required",
        description: "Please add your OpenWeatherMap API key to fetch weather data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isCoordinates 
        ? `${API_URL}?${query}&appid=${API_KEY}&units=metric`
        : `${API_URL}?q=${query}&appid=${API_KEY}&units=metric`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'City not found' : 'Weather service unavailable');
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        name: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        weatherMain: data.weather[0].main,
        icon: data.weather[0].icon,
      };

      setWeather(weatherData);
      toast({
        title: "Weather Updated",
        description: `Weather data loaded for ${weatherData.name}, ${weatherData.country}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = () => {
    if (city.trim()) {
      fetchWeather(city.trim());
    }
  };

  const handleLocationWeather = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(`lat=${latitude}&lon=${longitude}`, true);
        },
        () => {
          setError('Unable to get your location');
          toast({
            title: "Location Error",
            description: "Unable to access your location. Please search by city name.",
            variant: "destructive",
          });
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCitySearch();
    }
  };

  const currentTheme = weather ? getWeatherTheme(weather.weatherMain) : 'cloudy';
  const backgroundClass = `bg-gradient-${currentTheme}`;

  return (
    <div className={`min-h-screen transition-all duration-700 ${backgroundClass} p-4`}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold font-poppins text-white mb-2 animate-slide-up">
            WeatherVibe ✨
          </h1>
          <p className="text-white/80 text-lg font-inter">
            Your colorful weather companion
          </p>
        </div>

        {/* Search Controls */}
        <Card className="bg-card/95 backdrop-blur-sm border-input-border shadow-medium animate-slide-up">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter city name..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-inter bg-input border-input-border focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCitySearch}
                  disabled={loading || !city.trim()}
                  variant="weather"
                  className="px-6"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
                <Button 
                  onClick={handleLocationWeather}
                  disabled={loading}
                  variant="location"
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/20 animate-slide-up">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="font-inter">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Display */}
        {weather && (
          <Card className="bg-card/95 backdrop-blur-sm border-input-border shadow-medium animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-poppins text-card-foreground">
                {weather.name}, {weather.country}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Weather Display */}
              <div className="text-center space-y-4">
                <div className="text-6xl animate-float">
                  {getWeatherEmoji(weather.weatherMain, weather.icon)}
                </div>
                <div>
                  <div className="text-5xl font-bold font-poppins text-card-foreground">
                    {weather.temperature}°C
                  </div>
                  <div className="text-xl font-inter text-muted-foreground capitalize mt-2">
                    {weather.description}
                  </div>
                </div>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">💧</div>
                  <div className="text-sm font-inter text-muted-foreground">Humidity</div>
                  <div className="text-lg font-semibold font-poppins text-card-foreground">
                    {weather.humidity}%
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">💨</div>
                  <div className="text-sm font-inter text-muted-foreground">Wind Speed</div>
                  <div className="text-lg font-semibold font-poppins text-card-foreground">
                    {weather.windSpeed} km/h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!weather && !error && !loading && (
          <Card className="bg-card/95 backdrop-blur-sm border-input-border shadow-medium animate-slide-up">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4 animate-float">🌤️</div>
              <h3 className="text-xl font-semibold font-poppins text-card-foreground mb-2">
                Welcome to WeatherVibe!
              </h3>
              <p className="text-muted-foreground font-inter">
                Search for a city or use your current location to get started
              </p>
            </CardContent>
          </Card>
        )}

        {/* API Key Notice */}
        {(!API_KEY || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') && (
          <Card className="bg-accent/10 border-accent/20 animate-slide-up">
            <CardContent className="p-4">
              <div className="text-center text-accent-foreground">
                <p className="font-inter text-sm">
                  🔑 To use this app, get a free API key from{' '}
                  <a 
                    href="https://openweathermap.org/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-accent"
                  >
                    OpenWeatherMap
                  </a>
                  {' '}and add it to the WeatherApp component.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;