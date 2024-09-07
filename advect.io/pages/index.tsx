import React from "react";
import PageLayout from "../components/layout/PageLayout";
import HeadAssets from "../components/layout/HeadAssets";
import FooterAssets from "../components/layout/FooterAssets";
import { AddDocType, AddHTMLContentType, SetExpiry, type RouteView } from "../lib";
import FooterChildren from "../components/layout/FooterChildren";
import HeaderChildren from "../components/layout/HeaderChildren";
import { set } from "lodash";





export default async function (request: Request): Promise<RouteView> {
  const view = (
    <>
      <PageLayout
        head_assets={<HeadAssets />}
        footer_assets={<FooterAssets />}
        header_children={<HeaderChildren />}
        footer_children={<FooterChildren />}
      >
        <section className="bg-gray-50 text-black hero">
          <div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-3xl font-extrabold sm:text-5xl">
                Advect
                <strong className="font-extrabold text-red-700 sm:block">
                  Web Components
                </strong>
              </h1>

              <p className="mt-4 sm:text-xl/relaxed">
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Nesciunt illo tenetur fuga ducimus numquam ea!
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  className="block w-full rounded bg-red-600 px-12 py-3 text-sm font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring active:bg-red-500 sm:w-auto"
                  href="#"
                >
                  Get Started
                </a>

                <a
                  className="block w-full rounded px-12 py-3 text-sm font-medium text-red-600 shadow hover:text-red-700 focus:outline-none focus:ring active:text-red-500 sm:w-auto"
                  href="#"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>
      </PageLayout>
    </>
  );

  return {
    view,
    handle: async function (req: Request, res: Response) {
      return AddDocType(res).then(AddHTMLContentType).then(SetExpiry);
    },
  };
}

