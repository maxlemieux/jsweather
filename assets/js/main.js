$(document).ready(function() {
    let cityList = [];

    const updateCityList = () => {
        /* Get the newest city for the list from the search field */
        const thisCity = $('#search-field').val();
        cityList.push(thisCity);

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
        updateCityList();
    });

    $('#search-button').on('click', updateCityList);



    $('.city-item').on('click', function(event) {
        /* Show saved info on the right */
    });

});