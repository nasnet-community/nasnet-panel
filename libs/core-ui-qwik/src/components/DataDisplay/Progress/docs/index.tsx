import { component$ } from "@builder.io/qwik";

import APIReference from "./APIReference";
import Examples from "./Examples";
import Overview from "./Overview";
import Playground from "./Playground";
import Usage from "./Usage";

export default component$(() => {
  return (
    <>
      <Overview />
      <Examples />
      <APIReference />
      <Usage />
      <Playground />
    </>
  );
});
