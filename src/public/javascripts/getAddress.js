
// ====== Geocoding ======
function getAddress(search, next) {
  const geo = new google.maps.Geocoder(); 
  geo.geocode({address:search}, (results, status) => { 
      // If that was successful
      if (status == google.maps.GeocoderStatus.OK) {
        next(results)
      }
      // ====== Decode the error status ======
      else {
        console.log(`Geocode was not successful for the following reason: ${status}`);
        window.setTimeout(() => {getAddress(search, next), 1000});
        return;

      }
    }
  );
}