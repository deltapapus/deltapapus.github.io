// netlify/functions/hello-world.js

// Este es el handler. Es la función que se ejecuta cuando alguien accede a la función.
// El 'event' contiene los datos de la petición (headers, body, etc.).
exports.handler = async (event) => {
  try {
    // Si la petición no es GET, puedes enviar un error.
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Aquí puedes hacer lógica de backend: conectarte a una DB,
    // llamar a una API externa, etc.

    // El objeto de retorno debe tener 'statusCode' y 'body'.
    // El 'body' debe ser una string, así que JSON.stringify() es tu mejor amigo.
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '¡Hola desde tu primera Netlify Function! 🚀'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    // Manejo de errores por si algo sale mal
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor.' })
    };
  }
};