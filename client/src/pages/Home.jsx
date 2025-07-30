
import Layout from "../components/Layout";
const Home = () => {
return (
  <Layout>
    <div className="flex flex-col h-[80vh] bg-white shadow rounded-lg p-4">
      <div>
        <h1 className="text-2xl font-bold mb-4">Welcome to the Home Page</h1>
        <p className="text-gray-700">
            This is the home page of your application. You can navigate to the
            chatbot or dashboard from here.
        </p>
      </div>
    </div>
  </Layout>
);

}
export default Home;