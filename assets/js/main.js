$(document).ready(function() {
    /* OpenWeather API key */
    const apiKey = '8d0d2314d6e034efd962fbaf225561c3';
    
    /* Update the list of cities searched on */
    const updateCityList = (action, cityName) => {
        /* Reset the list */
        let cityList = [];

        /* Get the list from localstorage if it exists */
        if (localStorage.getItem('cityList')) {
            cityList = JSON.parse(localStorage.getItem('cityList'));
        };

        /* Add or remove a city from the list */
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

        /* Update local storage with the cityList */
        localStorage.setItem('cityList', JSON.stringify(cityList));

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
        $('#city-container').removeClass('hidden');

        $('.city-item').on('click', function(event) {
            /* Show saved info on the right */
            showCityInfo($(this).attr('data-city'));
        });

        /* Set focus to the search field again */
        $('#search-field').focus();
    };

    /* Request city info from localStorage or the Open Weather API */
    const citySearch = (cityName) => {
        let weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
        let forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`;
        if (localStorage.getItem(cityName)) {
            showCityInfo(cityName);
            updateCityList('add', cityName);
        } else {
            let weatherObject = {
                weather: null,
                forecast: null,
                forecastArray: [],
            };
            
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
                Step through all of the 3 hour datapoints in the .list. Build a results object
                and update the object's entries for a day if a new high temp or humidity is found.
                */
                for (thisForecast of weatherObject.forecast) {
                    const weatherIcon = `https://openweathermap.org/img/wn/${thisForecast.weather[0].icon}.png`;
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
                localStorage.setItem(cityName, JSON.stringify(weatherObject));
                
                /* Make the API call for UV index info, based on the lat/long we just got */
                getUvIndex(cityName)
            }, function() {
                /* If there was an error with either of the AJAX calls */
                updateCityList('remove', cityName);
                const alertNotFound = $( "<div class='alert alert-danger m-3'>Oops! We couldn't find that city.</div>" );
                $( "#main" ).append(alertNotFound);
                /* Fade out the alert */
                window.setTimeout(function() {
                    $(".alert").fadeTo(500, 0).slideUp(500, function(){
                        $(this).remove(); 
                    });
                }, 2000);
            });
        }
    };

    const getUvIndex = (cityName) => {
        const cityInfo = JSON.parse(localStorage.getItem(cityName));
        const lon = cityInfo.weather.coord.lon;
        const lat = cityInfo.weather.coord.lat;
        const uvIndexURL = `https://api.openweathermap.org/data/2.5/uvi?appid=${apiKey}&lat=${lat}&lon=${lon}`;
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
        const weatherDate = moment.unix(cityInfo.weather.dt).format('M/DD/YYYY');
        const kelvinTemp = cityInfo.weather.main.temp;
        const fahrenheitTemp = ((kelvinTemp - 273.15) * 9/5 + 32).toPrecision(3);
        const weatherIcon = cityInfo.weather.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;

        /* Show today's detailed information */
        $('#city').text(`${cityName} (${weatherDate})`);
        $('#icon').attr('src', iconUrl);
        $('#temp').text(`Temperature: ${fahrenheitTemp}`);
        $('#humidity').text(`Humidity: ${cityInfo.weather.main.humidity}`);
        $('#wind').text(`Wind Speed: ${cityInfo.weather.wind.speed}`);
        $('#uv').html(`UV Index: <span class='badge' id='uv-value'>${cityInfo.uvIndex}</span>`);

        /* Get the UV index severity: 0-3 low, 4-6 med, 7-9 high, over 9 DANGER */
        const uvIndex = cityInfo.uvIndex;
        let uvClass;
        switch(true) {
            case uvIndex < 4:
                uvClass = 'badge-secondary';
                break;
            case uvIndex < 7:
                uvClass = 'badge-success';
                break;
            case uvIndex < 9:
                uvClass = 'badge-warning';
                break;
            case uvIndex > 9:
                uvClass = 'badge-danger';
                break;
            default:
                uvClass = 'badge-secondary';
                break;
        };
        $('#uv-value').addClass(uvClass);
        
        /* Clear the forecast */
        $('#forecast-container').empty();
        $('#forecast-heading').text('5-Day Forecast:');

        for (forecast of cityInfo.forecastArray) {
            const forecastElement = $('<div>').attr('class', 'rounded bg-primary text-light m-1 p-2');
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

    /* Reusable function to be called by search event listeners */
    const doSearch = () => {
        const cityName = $('#search-field').val();
        
        /*
        Capitalize the first letter of the city
        A more thorough implementation would look for spaces and capitalize all words 
        */
        prettyCityName = cityName[0].toUpperCase() + cityName.slice(1);
        citySearch(prettyCityName);
        $('#search-field').blur();
        $('#search-field').val('');
    };

    /* Event listeners for search field and button */
    $('#search-form').on('submit', function(event) {
        event.preventDefault();
        doSearch();
    });

    $('#search-button').on('click', function() {
        doSearch();
    });

    $('#clear-button').on('click', function() {
        localStorage.clear();
        updateCityList();
    })

    /* Update the city list in case we have local storage when the page loads */
    updateCityList();
});