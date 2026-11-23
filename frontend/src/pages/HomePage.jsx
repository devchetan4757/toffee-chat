
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center px-2 pt-16 sm:px-4">
        <div className="h-[calc(100vh-4.5rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-lg">
          <div className="flex h-full overflow-hidden rounded-2xl">
            <ChatContainer />
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
