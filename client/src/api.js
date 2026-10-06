const API_BASE = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/$/, '');

async function callApi(path, options = {}) {
  const response = await fetch(
    API_BASE + path,
    options
  );

  const type =
    response.headers.get('content-type') || '';

  if (!type.includes('application/json')) {
    throw new Error(
      'Server returned an invalid response'
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Request failed'
    );
  }

  return data;
}

function postData(data) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

function getSessionId() {
  let id = localStorage.getItem(
    'contract-intelligence-session'
  );

  if (!id) {
    id = crypto.randomUUID();

    localStorage.setItem(
      'contract-intelligence-session',
      id
    );
  }

  return id;
}

export const api = {
  sessionId: () => getSessionId(),

  docs: () => {
    return callApi('/docs');
  },

  upload: (file) => {
    const formData = new FormData();

    formData.append('file', file);

    return callApi('/docs', {
      method: 'POST',
      body: formData
    });
  },

  remove: (id) => {
    return callApi(`/docs/${id}`, {
      method: 'DELETE'
    });
  },

  updateMetadata: (id, metadata) => {
    return callApi(`/docs/${id}/metadata`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metadata
      })
    });
  },

  chatHistory: (scope, sessionId) => {
    return callApi(
      `/chat/${scope}?sessionId=${encodeURIComponent(
        sessionId
      )}`
    );
  },

  clearChat: (scope, sessionId) => {
    return callApi(
      `/chat/${scope}?sessionId=${encodeURIComponent(
        sessionId
      )}`,
      {
        method: 'DELETE'
      }
    );
  },

  chat: (data) => {
    return callApi(
      '/chat',
      postData({
        ...data,
        sessionId: getSessionId()
      })
    );
  },

  review: (docId) => {
    return callApi(
      '/review',
      postData({ docId })
    );
  }
};
