$(document).ready(function() {
    const apiKey = '8d0d2314d6e034efd962fbaf225561c3';
    
    let cityList = [];

    const updateCityList = (action, cityName) => {
        if (cityList.includes(cityName) && action === 'add') {
            return;
        } else if (action === 'add') {
            cityList.push(cityName);
        } else if (action === 'remove') {
            for(let i = 0; i < cityList.length; i++){ 
                if ( cityList[i] === cityName) {
                  cityList.splice(i, 1); 
                };
            };
        }
        /* Reset the unordered list of cities and rebuild it */
        const cityListElement = $('#city-list');
        cityListElement.empty();
        for (const city of cityList) {
            const cityElement = $('<li>');
            cityElement.attr('class', 'list-group-item city-item');
            cityElement.attr('data-city', city);
            cityElement.text(city);
            cityListElement.append(cityElement);
        };

        $('.city-item').on('click', function(event) {
            /* Show saved info on the right */
            showCityInfo($(this).attr('data-city'));
        });
    };

    /* Request city info from localStorage or the Open Weather API */
    const citySearch = (cityName) => {
        let weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
        let forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`;
        if (localStorage.getItem(cityName)) {
            console.log('Local storage found');
            showCityInfo(cityName);
            updateCityList('add', cityName);
        } else {
            let weatherObject = {
                weather: null,
                forecast: null,
                forecastArray: [],
            };
            console.log('Local storage not found, getting from API')
            
            /* Get both objects before processing the results */
            $.when(
                $.ajax({
                    url: weatherURL,
                    method: "GET"
                }),
                $.ajax({
                    url: forecastURL,
                    method: "GET"
                })
            ).then(function(thisWeather, thisForecastList) {
                weatherObject.weather = thisWeather[0];
                weatherObject.forecast = thisForecastList[0].list;
                
                /*
                    Build an array of objects that includes the following information for each of the next 5 days:
                    The date as .format('M/DD/YYYY')
                    The overall weather (sunny, cloudy etc) along with the icon for that weather
                    The temperature (high)
                    The humidity (high)
                    {date: }
                    Step through all of the 3 hour datapoints in the .list. Build a results object
                    and update the object's entries for a day if a new high temp or humidity is found.
                */
                for (thisForecast of weatherObject.forecast) {
                    //console.log(thisForecast);
                    const weatherIcon = `http://openweathermap.org/img/wn/${thisForecast.weather[0].icon}.png`;
                    const weatherDate = moment(thisForecast.dt_txt).format('M/DD/YYYY');
                    const weatherHour = moment(thisForecast.dt_txt).format('HH');
                    const fahrenheitTemp = ((thisForecast.main.temp - 273.15) * 9/5 + 32).toPrecision(3);
                    if (weatherHour === '15') {
                        weatherObject.forecastArray.push(
                            {
                                date: weatherDate,
                                weather: weatherIcon,
                                temperature: fahrenheitTemp,
                                humidity: thisForecast.main.humidity
                            }
                        );
                    };
                };
                //console.log(weatherObject.forecastArray);
                localStorage.setItem(cityName, JSON.stringify(weatherObject));
                
                /* Make the API call for UV index info, based on the lat/long we just got */
                getUvIndex(cityName)
            }, function() {
                /* If there was an error with either of the AJAX calls */
                console.log("error getting info, remove this city and show an error on page");
                updateCityList('remove', cityName);
            });

        };
        
    };

    const getUvIndex = (cityName) => {
        const cityInfo = JSON.parse(localStorage.getItem(cityName));
        const lon = cityInfo.weather.coord.lon;
        const lat = cityInfo.weather.coord.lat;
        const uvIndexURL = `http://api.openweathermap.org/data/2.5/uvi?appid=${apiKey}&lat=${lat}&lon=${lon}`;
        $.ajax({
            url: uvIndexURL,
            method: "GET",
        }).then(function(response) {
                cityInfo.uvIndex = response.value;
                localStorage.setItem(cityName, JSON.stringify(cityInfo));

                /* Add this city to the list on page */
                updateCityList('add', cityName);

                /* Show all the city info */
                showCityInfo(cityName);
            }
        );
    }

    /* Print information about the weather on the right side of the screen */
    const showCityInfo = (cityName) => {
        const cityInfo = JSON.parse(localStorage.getItem(cityName));
        //console.log(cityInfo.weather);
        const weatherDate = moment.unix(cityInfo.weather.dt).format('M/DD/YYYY');
        const kelvinTemp = cityInfo.weather.main.temp;
        const fahrenheitTemp = ((kelvinTemp - 273.15) * 9/5 + 32).toPrecision(3);
        const weatherIcon = cityInfo.weather.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${weatherIcon}@2x.png`;

        /* Show today's detailed information */
        $('#city').text(`${cityName} (${weatherDate})`);
        $('#icon').attr('src', iconUrl);
        $('#temp').text(`Temperature: ${fahrenheitTemp}`);
        $('#humidity').text(`Humidity: ${cityInfo.weather.main.humidity}`);
        $('#wind').text(`Wind Speed: ${cityInfo.weather.wind.speed}`);
        $('#uv').text(`UV Index: ${cityInfo.uvIndex}`);

        /* Get the UV index severity: 0-3 low, 4-6 med, 7-9 high, over 9 DANGER */
        const uvIndex = cityInfo.uvIndex;
        let uvClass;
        switch(true) {
            case uvIndex < 4:
                uvClass = 'uvLow';
                break;
            default:
                break;
        }
        
        /* Clear the forecast */
        $('#forecast-container').empty();
        $('#forecast-heading').text('5-Day Forecast:');

        for (forecast of cityInfo.forecastArray) {
            const forecastElement = $('<div>').attr('class', 'rounded bg-primary text-light mx-3 p-2');
            const forecastDate = $('<h5>').text(forecast.date);
            forecastElement.append(forecastDate);

            const forecastWeather = $('<img>').attr('src', forecast.weather);
            forecastElement.append(forecastWeather);

            const forecastTemp = $('<p>').html(`Temp: ${forecast.temperature} &#176;`);
            forecastElement.append(forecastTemp);

            const forecastHumidity = $('<p>').text(`Humidity: ${forecast.humidity}%`);
            forecastElement.append(forecastHumidity);

            $('#forecast-container').append(forecastElement);
        }
    };

    /* Event listeners for search field and button */
    $('#search-form').on('submit', function(event) {
        event.preventDefault();
        const cityName = $('#search-field').val();
        citySearch(cityName);
    });

    $('#search-button').on('click', function() {
        const cityName = $('#search-field').val();
        citySearch(cityName);
    });
});