const apiKey = "Your API Key "; 
const cityInput = document.getElementById("city_search");
const searchBtn = document.getElementById("search_btn");
const locationBtn = document.getElementById("location_btn");
const autocompleteResults = document.getElementById("autocomplete_results");
const tempEl = document.getElementById("temperature");
const weatherIconEl = document.getElementById("weather_icon");
const cityEl = document.getElementById("city");
const parameterEl = document.getElementById("weather_parameter");

const humidityEl = document.getElementById("weather_humidity");
const windEl = document.getElementById("weather_wind");
const pressureEl = document.getElementById("weather_pressure");
const visibilityEl = document.getElementById("weather_visibility");
const sunriseEl = document.getElementById("weather_sunrise");
const sunsetEl = document.getElementById("weather_sunset");

const contentMap = document.getElementById("content_top_right");

const unitToggle = document.getElementById("unit_toggle");
const refreshBtn = document.getElementById("refresh_btn");

let unit = "metric"; // default Celsius
let currentCity = "Port Harcourt";

// Format UNIX timestamp to hh:mm
function formatTime(timestamp, timezone) {
    let date = new Date((timestamp + timezone) * 1000);
    return date.toUTCString().match(/\d{2}:\d{2}/)[0];
}

// Save to cache (with history)
function saveCache(city, unit) {
    let lastCity = localStorage.getItem("weatherCity");
    if (lastCity && lastCity !== city) {
        localStorage.setItem("weatherPrevCity", lastCity);
    }
    localStorage.setItem("weatherCity", city);
    localStorage.setItem("weatherUnit", unit);
}

// Load from cache
function loadCache() {
    let savedCity = localStorage.getItem("weatherCity");
    let savedUnit = localStorage.getItem("weatherUnit");
    if (savedCity) {
        currentCity = savedCity;
        unit = savedUnit || "metric";
        unitToggle.querySelectorAll(".unit_btn").forEach(b => {
            b.classList.remove("active");
            if ((unit === "metric" && b.dataset.unit === "celsius") ||
                (unit === "imperial" && b.dataset.unit === "fahrenheit")) {
                b.classList.add("active");
            }
        });
        fetchWeather(currentCity);
        return true;
    }
    return false;
}

// Fetch weather
async function fetchWeather(city) {
    try {
        let geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
        let geoData = await geoRes.json();
        if (!geoData.length) {
            alert("City not found!");
            return;
        }
        let { lat, lon, name } = geoData[0];
        currentCity = name;

        let res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
        let data = await res.json();

        let current = data.list[0];
        tempEl.innerHTML = `<h3>${Math.round(current.main.temp)}°</h3>`;
        parameterEl.textContent = current.weather[0].description;
        weatherIconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png">`;
        cityEl.innerHTML = `<p>${name}</p>`;

        humidityEl.innerHTML = `Humidity <br>${current.main.humidity}%`;
        windEl.innerHTML = `Wind <br>${current.wind.speed} m/s`;
        pressureEl.innerHTML = `Pressure <br>${current.main.pressure} hPa`;
        visibilityEl.innerHTML = `Visibility <br>${current.visibility/1000} KM`;
        sunriseEl.innerHTML = `Sunrise <br>${formatTime(data.city.sunrise, data.city.timezone)}`;
        sunsetEl.innerHTML = `Sunset <br>${formatTime(data.city.sunset, data.city.timezone)}`;

        let days = [1,2,3,4];
        days.forEach((d, i) => {
            let forecast = data.list[i*8];
            document.querySelector(`.day${d} #temperature2 p`).textContent = 
                `${Math.round(forecast.main.temp_max)}/${Math.round(forecast.main.temp_min)}`;
            document.querySelector(`.day${d} #weekDay p`).textContent = 
                new Date(forecast.dt_txt).toLocaleDateString('en-US', { weekday: 'long' });
            document.querySelector(`.day${d} #weather_icon2`).innerHTML = 
                `<img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png">`;
            document.querySelector(`.day${d} button`).onclick = () => {
                tempEl.innerHTML = `<h3>${Math.round(forecast.main.temp)}°</h3>`;
                parameterEl.textContent = forecast.weather[0].description;
                weatherIconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png">`;
                humidityEl.innerHTML = `Humidity <br>${forecast.main.humidity}%`;
                windEl.innerHTML = `Wind <br>${forecast.wind.speed} m/s`;
                pressureEl.innerHTML = `Pressure <br>${forecast.main.pressure} hPa`;
                visibilityEl.innerHTML = `Visibility <br>${forecast.visibility/1000} KM`;
            };
        });

        contentMap.innerHTML = `<iframe width="100%" height="187" frameborder="0"
            src="https://maps.google.com/maps?q=${lat},${lon}&z=12&output=embed"></iframe>`;

        saveCache(city, unit);

    } catch (err) {
        console.error(err);
    }
}

// Autocomplete
cityInput.addEventListener("input", async () => {
    let q = cityInput.value;
    if (q.length < 2) {
        autocompleteResults.style.display = "none";
        return;
    }
    let res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=5&appid=${apiKey}`);
    let data = await res.json();
    autocompleteResults.innerHTML = "";
    data.forEach(c => {
        let div = document.createElement("div");
        div.className = "autocomplete_item";
        div.textContent = `${c.name}, ${c.country}`;
        div.onclick = () => {
            fetchWeather(c.name);
            cityInput.value = c.name;
            autocompleteResults.style.display = "none";
        };
        autocompleteResults.appendChild(div);
    });
    autocompleteResults.style.display = "block";
});

// Search button
searchBtn.addEventListener("click", () => {
    if (cityInput.value.trim()) fetchWeather(cityInput.value.trim());
});

// Location button
locationBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(async pos => {
        let { latitude, longitude } = pos.coords;
        let res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`);
        let data = await res.json();
        fetchWeather(data.city.name);
    });
});

// Unit toggle
unitToggle.querySelectorAll(".unit_btn").forEach(btn => {
    btn.addEventListener("click", () => {
        unitToggle.querySelectorAll(".unit_btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        unit = btn.dataset.unit === "celsius" ? "metric" : "imperial";
        fetchWeather(currentCity);
    });
});

// Refresh button
refreshBtn.addEventListener("click", () => {
    let prevCity = localStorage.getItem("weatherPrevCity");
    let lastCity = localStorage.getItem("weatherCity");
    if (prevCity) {
        fetchWeather(prevCity);
    } else if (lastCity) {
        fetchWeather(lastCity);
    } else {
        fetchWeather("Port Harcourt"); // ultimate fallback
    }
});

// Initial load
if (!loadCache()) {
    fetchWeather(currentCity);
}
