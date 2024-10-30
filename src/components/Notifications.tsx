import { useEffect } from "react";
import { Toaster, toast } from "sonner";

export default function () {
  useEffect(() => {
    // Initiate the first call to connect to SSE API
    const eventSource = new EventSource("/sse");

    const messageListener = (event: any) => {
      const tmp = event.data;
      // Do something with the obtained message
      toast(tmp);
    };

    const closeListener = () => eventSource.close();

    // Close the connection to SSE API if any error
    eventSource.addEventListener("error", closeListener);

    // Listen to events received via the SSE API
    eventSource.addEventListener("message", messageListener);

    // As the component unmounts, close listeners to SSE API
    return () => {
      eventSource.removeEventListener("error", closeListener);
      eventSource.removeEventListener("message", messageListener);
      eventSource.close();
    };
  }, []);

  return (
    <>
      <Toaster />
    </>
  );
}
