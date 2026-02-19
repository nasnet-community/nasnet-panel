import { $, component$, useContext } from "@builder.io/qwik";
import { Button } from "@nas-net/core-ui-qwik";
import { StarContext } from "@nas-net/star-context";

import { Header } from "./Header";
import { InterfaceSelector } from "./InterfaceSelector";
import { InterfaceTypeSelector } from "./InterfaceTypeSelector";
import { LTESettings } from "./LTESettings";
import { useWANInterface } from "./useWANInterface";
import { WirelessSettings } from "./WirelessSettings";

import type { WANInterfaceProps } from "./types";

export const WANInterfaceEasy = component$<WANInterfaceProps>(
  ({ mode, isComplete, onComplete$ }) => {
    const starContext = useContext(StarContext);
    const {
      selectedInterfaceType,
      selectedInterface,
      ssid,
      password,
      apn,
      isValid,
      validateForm,
      handleInterfaceTypeSelect,
      handleInterfaceSelect,
      handleSSIDChange,
      handlePasswordChange,
      handleAPNChange,
    } = useWANInterface(mode);

    const masterRouter = starContext.state.Choose.RouterModels.find(
      (rm) => rm.isMaster,
    );

    const availableInterfaces = masterRouter
      ? masterRouter.Interfaces
      : {
          Interfaces: {
            ethernet: [],
            wireless: [],
            sfp: [],
            lte: [],
          },
          OccupiedInterfaces: [],
        };

    const handleComplete = $(async () => {
      if (await validateForm()) {
        onComplete$();
      }
    });

    return (
      <div class="w-full p-4">
        <div class="rounded-lg bg-surface p-6 shadow-md transition-all dark:bg-surface-dark">
          <div class="space-y-6">
            <Header mode={mode} />

            <InterfaceTypeSelector
              selectedType={selectedInterfaceType.value}
              onSelect$={handleInterfaceTypeSelect}
              availableInterfaces={availableInterfaces}
            />

            {selectedInterfaceType.value && (
              <InterfaceSelector
                selectedInterface={selectedInterface.value}
                selectedInterfaceType={selectedInterfaceType.value}
                availableInterfaces={availableInterfaces}
                onSelect={handleInterfaceSelect}
                mode={mode}
              />
            )}

            {selectedInterfaceType.value === "Wireless" && selectedInterface.value && (
              <WirelessSettings
                ssid={ssid.value}
                password={password.value}
                onSSIDChange={handleSSIDChange}
                onPasswordChange={handlePasswordChange}
              />
            )}

            {selectedInterfaceType.value === "LTE" && selectedInterface.value && (
              <LTESettings
                apn={apn.value}
                onAPNChange$={handleAPNChange}
              />
            )}

            <div class="flex items-center justify-between border-t border-border pt-4 dark:border-border-dark">
              <span
                class={`text-sm ${isComplete ? "text-success" : "text-warning"}`}
              >
                {isComplete
                  ? $localize`Configuration Complete`
                  : $localize`Configuration Incomplete`}
              </span>
              <Button
                onClick$={handleComplete}
                variant="primary"
                size="sm"
                disabled={!isValid.value || isComplete}
              >
                {isComplete ? $localize`Configured` : $localize`Save`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
