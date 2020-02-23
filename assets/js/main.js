$(document).ready(function() {
    const apiKey = '8d0d2314d6e034efd962fbaf225561c3';
    
    let cityList = [];

    const updateCityList = (cityName) => {
        if (cityList.includes(cityName)) {
            return;
        } else {
            cityList.push(cityName);
        }
        /* Reset the unordered list of cities and rebuild it */
        const cityListElement = $('#city-list');
        cityListElement.empty();
        for (const city of cityList) {
            console.log(city);
            const cityElement = $('<li>');
            cityElement.attr('class', 'list-group-item city-item');
            cityElement.attr('data-city', city);
            cityElement.text(city);
            cityListElement.append(cityElement);
        };
    };

    $('#search-form').on('submit', function(event) {
        event.preventDefault();
        let cityName = $('#search-field').val();
        updateCityList(cityName);
        citySearch(cityName);
    });

    $('#search-button').on('click', function() {
        let cityName = $('#search-field').val();
        updateCityList(cityName);
        citySearch(cityName);
    });



    $('.city-item').on('click', function(event) {
        /* Show saved info on the right */
    });

    /* Request city info from localStorage or the Open Weather API */
    const citySearch = (cityName) => {
        let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
        if (localStorage.getItem(cityName)) {
            console.log('Local storage found')
            const response = JSON.parse(localStorage.getItem(cityName));
            const kelvinTemp = response.main.temp;
            const fahrenheitTemp = ((kelvinTemp - 273.15) * 9/5 + 32).toPrecision(3);
            $('#city').text(cityName);
            $('#temp').text(`Temperature: ${fahrenheitTemp}`);
            $('#humidity').text(`Humidity: ${response.main.humidity}`);
            $('#wind').text(response.wind.speed);
        } else {
            console.log('Local storage not found, getting from API')
            $.ajax({
                url: queryURL,
                method: "GET"
            }).then(function(response) {
                const kelvinTemp = response.main.temp;
                const fahrenheitTemp = ((kelvinTemp - 273.15) * 9/5 + 32).toPrecision(3);
                $('#city').text(cityName);
                $('#temp').text(`Temperature: ${fahrenheitTemp}`);
                $('#humidity').text(`Humidity: ${response.main.humidity}`);
                $('#wind').text(response.wind.speed);
                localStorage.setItem(cityName, JSON.stringify(response))
            });
        };
    };

    const showCityInfo = (cityName) => {

    };
});