
export default function HeaderChildren() {
    return <>
    <adv-view onload="
        el.data.opened = false;
    ">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <a href="/" className="text-lg font-bold text-gray-800">Advect</a>
            </div>
  
            <div className="hidden lg:flex items-center space-x-4">
              <a href="/" className="text-gray-800 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-800 hover:text-gray-900">Docs</a>
              <a href="#" className="text-gray-800 hover:text-gray-900">Editor</a>

              <div className="bg-gray-200 flex gap-2 p-2">
                  <a href="#" className="text-gray-800 hover:text-gray-900">Login</a>
                  <>/</>
                  <a href="/auth/register" className="text-gray-800 hover:text-gray-900">Register</a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      </adv-view>
    </>;
  }