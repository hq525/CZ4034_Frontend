import axios from 'axios';

export default class API {
  get(path) {
    return new Promise((resolve, reject) => {
      axios
        .get(path)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error.response);
        });
    });
  }
}
