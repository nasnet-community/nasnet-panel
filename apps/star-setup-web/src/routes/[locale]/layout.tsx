import { component$, Slot } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { Header, Footer, MobileWarning } from "@nas-net/core-ui-qwik";
import { extractLang, useI18n } from "../i18n-utils";

export const onRequest: RequestHandler = ({ locale, params }) => {
  locale(extractLang(params.locale));
};

export const head: DocumentHead = {
  title: "NASNET Connect",
  meta: [
    {
      name: "description",
      content: "Help you connect with the world",
    },
  ],
};

export default component$(() => {
  useI18n();
  return (
    <div class="flex min-h-screen flex-col">
      <MobileWarning />
      <Header />
      <main class="flex-grow pt-20">
        <Slot />
      </main>
      <Footer />
    </div>
  );
});
