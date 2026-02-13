import { useMutation, useApolloClient } from '@apollo/client';
import {
  START_INSTANCE,
  STOP_INSTANCE,
  RESTART_INSTANCE,
  DELETE_INSTANCE,
  GET_SERVICE_INSTANCES,
  GET_SERVICE_INSTANCE,
} from './services.graphql';
import type {
  StartInstanceInput,
  StopInstanceInput,
  RestartInstanceInput,
  DeleteInstanceInput,
} from '@nasnet/api-client/generated';

/**
 * Hook providing all service instance lifecycle mutations
 */
export function useInstanceMutations() {
  const client = useApolloClient();

  const [startInstance, startMutation] = useMutation(START_INSTANCE, {
    refetchQueries: [GET_SERVICE_INSTANCES, GET_SERVICE_INSTANCE],
  });

  const [stopInstance, stopMutation] = useMutation(STOP_INSTANCE, {
    refetchQueries: [GET_SERVICE_INSTANCES, GET_SERVICE_INSTANCE],
  });

  const [restartInstance, restartMutation] = useMutation(RESTART_INSTANCE, {
    refetchQueries: [GET_SERVICE_INSTANCES, GET_SERVICE_INSTANCE],
  });

  const [deleteInstance, deleteMutation] = useMutation(DELETE_INSTANCE, {
    onCompleted: (data) => {
      if (data?.deleteInstance?.instance === null) {
        // Instance deleted successfully, invalidate cache
        client.refetchQueries({
          include: [GET_SERVICE_INSTANCES],
        });
      }
    },
  });

  return {
    startInstance: (input: StartInstanceInput) =>
      startInstance({ variables: { input } }),
    stopInstance: (input: StopInstanceInput) =>
      stopInstance({ variables: { input } }),
    restartInstance: (input: RestartInstanceInput) =>
      restartInstance({ variables: { input } }),
    deleteInstance: (input: DeleteInstanceInput) =>
      deleteInstance({ variables: { input } }),
    loading: {
      start: startMutation.loading,
      stop: stopMutation.loading,
      restart: restartMutation.loading,
      delete: deleteMutation.loading,
    },
    errors: {
      start: startMutation.error,
      stop: stopMutation.error,
      restart: restartMutation.error,
      delete: deleteMutation.error,
    },
  };
}
