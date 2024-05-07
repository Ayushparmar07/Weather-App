const API_KEY = "f432056259787ab3bda5ef1101c0aa2f";

const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const getCitiesUsingGeolocation = async (searchText)=> {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&appid=${API_KEY}`)
    // console.log(await response.json());
    return response.json()
}

const getCurrentWeatherData = async ()=>{
    const city = "pune"
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
    return response.json()

}

const getHourlyForecast = async ({name : city})=> {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
    const data = await response.json()
    return data.list.map(forecast => {
        const {main:{temp, temp_max, temp_min}, dt, dt_txt, weather: [{description, icon}]} = forecast
        return {temp, temp_max, temp_min, dt, dt_txt, description, icon}
    })
}


const formatTemperature = (temp) => `${temp?.toFixed(1)}º`
const createIconUrl = (icon)=> `https://openweathermap.org/img/wn/${icon}@2x.png`

const loadCurrentForecast = ({name, main:{temp, temp_max, temp_min}, weather:[{description}]})=>{
    
    const currentForecastElement = document.querySelector("#current-forecast")
    currentForecastElement.querySelector('.city').textContent = name;
    currentForecastElement.querySelector('.temp').textContent = formatTemperature(temp);
    currentForecastElement.querySelector('.description').textContent = description;
    currentForecastElement.querySelector('.min-max-temp').textContent = `H: ${formatTemperature(temp_max)} L: ${formatTemperature(temp_min)}` ;
    // <h1>city name</h1>
	// <p class="temp">Temp</p>
	// <p class="description">Description</p>
	// <p class="min-max-temp">High low</p>
}

const loadHourlyForecast = ({main: {temp: tempNow}, weather: [{icon:iconNow}]},hourlyforecast) =>{
    // console.log(hourlyforecast);
    const timeFormatter = Intl.DateTimeFormat("en", {hour12: true, hour: "numeric"} )
    let datafor12hours = hourlyforecast.slice(1,13)
    const hourlyContainer = document.querySelector(".hourly-container");
    let innerHTMLString = `<article>
    <h3 class="time">Now</h3>
    <img class="icon" src="${createIconUrl(iconNow)}" alt="" />
    <p class="hourly-temp">${formatTemperature(tempNow)}</p>
</article>`;

for (let {temp, icon, dt_txt} of datafor12hours) {
    innerHTMLString += `<article>
    <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
    <img class="icon" src="${createIconUrl(icon)}" alt="" />
        <p class="hourly-temp">${formatTemperature(temp)}</p>
    </article>`
    }
    hourlyContainer.innerHTML = innerHTMLString
}

const calculateDayWiseForecast = (hourlyforecast) => {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyforecast) {
        const date = forecast.dt_txt.split(" ")[0];
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        // console.log(dayOfTheWeek);
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast);
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
        } else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }
    }
    // console.log(dayWiseForecast);
    for (let [key, value] of dayWiseForecast) {
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.max(...Array.from(value, val => val.temp_max));

        dayWiseForecast.set(key, {temp_min, temp_max, icon : value.find(v => v.icon).icon});
    }
    // console.log(dayWiseForecast);
    return dayWiseForecast;
}
const loadFiveDayForecast = (hourlyforecast)=>{
    // console.log(hourlyforecast);
    const dayWiseForecast = calculateDayWiseForecast(hourlyforecast);
    // console.log(dayWiseForecast);
    const container = document.querySelector('.five-day-forecast-container')
    let dayWiseInfo = '';
    Array.from(dayWiseForecast).map(([key, {temp_max, temp_min, icon}], index) =>{  
        if (index < 5){
            dayWiseInfo += `<article class="day-wise-forecast">
            <h3 class="day">${index === 0? "today":key}</h3>
            <img class="icon" src="${createIconUrl(icon)}" alt="" />
            <p class="min-temp">${formatTemperature(temp_min)}</p>
            <p class="max-temp">${formatTemperature(temp_max)}</p>
            </article>`    
        }
    });
        
    container.innerHTML = dayWiseInfo;
}

const loadFeelsLike =  ({main: {feels_like}})=>{
    let container = document.querySelector('#feels-like');
    container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like)
}

const loadHumidity = ({main:{humidity}})=>{
    const container = document.querySelector('#humidity');
    document.querySelector(".humidity-value").textContent = `${humidity}%`

}

function debounce(func) {
    let timer;
    return (...args) => {
        clearTimeout(timer); // clear existing timer
        // clear a new time till the user is typing
        timer = setTimeout(() => {
            console.log("debounce");
            func.apply(this, args)
        }, 500)
    }
}

const onSearchChange = async (event) => {
    let { value } = event.target;
    const listOfCities = await getCitiesUsingGeolocation(value)
    let options =  ``;
    for (let {lat, lon, name, state, country } of listOfCities) {
        options += `<option data-city-details="${JSON.stringify([lat, lon, name])} value="${name}, ${state}, ${country}"></option>`
    }
    document.querySelector("#cities").innerHTML = options;
    console.log(listOfCities);
}

const debounceSearch = debounce((event) => onSearchChange(event));

document.addEventListener('DOMContentLoaded', async ()=>{
    
    const searchText = document.querySelector("#search")
    searchText.addEventListener("input", onSearchChange);

    const currentWeather = await getCurrentWeatherData();
    // console.log(currentWeather);
    loadCurrentForecast(currentWeather);
    
    const hourlyforecast = await getHourlyForecast(currentWeather);
    loadHourlyForecast(currentWeather, hourlyforecast);
    
    loadFiveDayForecast(hourlyforecast);
    
    loadFeelsLike(currentWeather);
    
    loadHumidity(currentWeather);
})

