// Test script for Google Places New API
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCVH3C_GGhV4GZhe5EhQs2_X8uoHmLBLRU';

async function testPlacesAutocomplete() {
  console.log('Testing Google Places New API autocomplete...');
  
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: "123 Main St",
          languageCode: "en",
        }),
      }
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function testPlaceDetails() {
  console.log('\nTesting Google Places New API place details...');
  
  try {
    // First get a place ID from autocomplete
    const autocompleteResponse = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: "123 Main St",
          languageCode: "en",
        }),
      }
    );

    if (autocompleteResponse.ok) {
      const autocompleteData = await autocompleteResponse.json();
      const placeId = autocompleteData.suggestions?.[0]?.placePrediction?.placeId;
      
      if (placeId) {
        console.log('Got place ID:', placeId);
        
        // Now get place details
        const detailsResponse = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}?key=${API_KEY}`,
          {
            headers: {
              "X-Goog-FieldMask": "addressComponents,formattedAddress,displayName",
            },
          }
        );

        console.log('Details response status:', detailsResponse.status);
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          console.log('Success! Place details:', JSON.stringify(detailsData, null, 2));
        } else {
          const errorText = await detailsResponse.text();
          console.error('Details error response:', errorText);
        }
      } else {
        console.log('No place ID found in autocomplete response');
      }
    } else {
      const errorText = await autocompleteResponse.text();
      console.error('Autocomplete error response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run tests
testPlacesAutocomplete().then(() => {
  return testPlaceDetails();
}).then(() => {
  console.log('\nTests completed!');
}).catch(console.error); 