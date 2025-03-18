type Method = "post" | "get" | "delete" | "put";

type Success = {
  success: true;
  data: any;
};

type Error = {
  success: false;
  code: number;
};

type Response = Success | Error;

export async function fetchApi(
  url: string,
  method: Method,
  body?: Record<string, any>,
  headers?: Record<string, any>
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return {
      success: false,
      code: response.status,
    };
  }

  const data = await response.json();
  return {
    success: true,
    data,
  };
}
