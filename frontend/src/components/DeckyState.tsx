import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '../notification-service';
import { DisabledPlugin, Plugin } from '../plugin';
import { PluginUpdateMapping } from '../store';
import { VerInfo } from '../updater';

interface PublicDeckyState {
  plugins: Plugin[];
  disabledPlugins: DisabledPlugin[];
  installedPlugins: (Plugin | DisabledPlugin)[];
  pluginOrder: string[];
  frozenPlugins: string[];
  hiddenPlugins: string[];
  activePlugin: Plugin | null;
  updates: PluginUpdateMapping | null;
  hasLoaderUpdate?: boolean;
  isLoaderUpdating: boolean;
  versionInfo: VerInfo | null;
  notificationSettings: NotificationSettings;
  userInfo: UserInfo | null;
}

export interface UserInfo {
  username: string;
  path: string;
}

export class DeckyState {
  private _plugins: Plugin[] = [];
  private _disabledPlugins: DisabledPlugin[] = [];
  private _installedPlugins: (Plugin | DisabledPlugin)[] = [];
  private _pluginOrder: string[] = [];
  private _frozenPlugins: string[] = [];
  private _hiddenPlugins: string[] = [];
  private _activePlugin: Plugin | null = null;
  private _updates: PluginUpdateMapping | null = null;
  private _hasLoaderUpdate: boolean = false;
  private _isLoaderUpdating: boolean = false;
  private _versionInfo: VerInfo | null = null;
  private _notificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
  private _userInfo: UserInfo | null = null;

  public eventBus = new EventTarget();

  publicState(): PublicDeckyState {
    return {
      plugins: this._plugins,
      disabledPlugins: this._disabledPlugins,
      installedPlugins: this._installedPlugins,
      pluginOrder: this._pluginOrder,
      frozenPlugins: this._frozenPlugins,
      hiddenPlugins: this._hiddenPlugins,
      activePlugin: this._activePlugin,
      updates: this._updates,
      hasLoaderUpdate: this._hasLoaderUpdate,
      isLoaderUpdating: this._isLoaderUpdating,
      versionInfo: this._versionInfo,
      notificationSettings: this._notificationSettings,
      userInfo: this._userInfo,
    };
  }

  setVersionInfo(versionInfo: VerInfo) {
    this._versionInfo = versionInfo;
    this.notifyUpdate();
  }

  setPlugins(plugins: Plugin[]) {
    this._plugins = plugins;
    this._installedPlugins = [...plugins, ...this._disabledPlugins];
    this.notifyUpdate();
  }

  setDisabledPlugins(disabledPlugins: DisabledPlugin[]) {
    this._disabledPlugins = disabledPlugins;
    this._installedPlugins = [...this._plugins, ...disabledPlugins];
    this.notifyUpdate();
  }

  setPluginOrder(pluginOrder: string[]) {
    this._pluginOrder = pluginOrder;
    this.notifyUpdate();
  }

  setFrozenPlugins(frozenPlugins: string[]) {
    this._frozenPlugins = frozenPlugins;
    this.notifyUpdate();
  }

  setHiddenPlugins(hiddenPlugins: string[]) {
    this._hiddenPlugins = hiddenPlugins;
    this.notifyUpdate();
  }

  setActivePlugin(name: string) {
    this._activePlugin = this._plugins.find((plugin) => plugin.name === name) ?? null;
    this.notifyUpdate();
  }

  closeActivePlugin() {
    this._activePlugin = null;
    this.notifyUpdate();
  }

  setUpdates(updates: PluginUpdateMapping) {
    this._updates = updates;
    this.notifyUpdate();
  }

  setHasLoaderUpdate(hasUpdate: boolean) {
    this._hasLoaderUpdate = hasUpdate;
    this.notifyUpdate();
  }

  setIsLoaderUpdating(isUpdating: boolean) {
    this._isLoaderUpdating = isUpdating;
    this.notifyUpdate();
  }

  setNotificationSettings(notificationSettings: NotificationSettings) {
    this._notificationSettings = notificationSettings;
    this.notifyUpdate();
  }

  setUserInfo(userInfo: UserInfo) {
    this._userInfo = userInfo;
    this.notifyUpdate();
  }

  private notifyUpdate() {
    this.eventBus.dispatchEvent(new Event('update'));
  }
}

interface DeckyStateContext extends PublicDeckyState {
  setVersionInfo(versionInfo: VerInfo): void;
  setIsLoaderUpdating(hasUpdate: boolean): void;
  setActivePlugin(name: string): void;
  setPluginOrder(pluginOrder: string[]): void;
  setDisabledPlugins(disabled: DisabledPlugin[]): void;
  closeActivePlugin(): void;
}

const DeckyStateContext = createContext<DeckyStateContext | null>(null);

export const useDeckyState = () => {
  const deckyState = useContext(DeckyStateContext);

  if (deckyState === null) {
    throw new Error('useDeckyState needs a parent DeckyStateContext');
  }

  return deckyState;
};

interface Props {
  deckyState: DeckyState;
  children?: ReactNode;
}

export const DeckyStateContextProvider: FC<Props> = ({ children, deckyState }) => {
  const [publicDeckyState, setPublicDeckyState] = useState<PublicDeckyState>({ ...deckyState.publicState() });

  useEffect(() => {
    function onUpdate() {
      setPublicDeckyState({ ...deckyState.publicState() });
    }

    deckyState.eventBus.addEventListener('update', onUpdate);

    return () => deckyState.eventBus.removeEventListener('update', onUpdate);
  }, []);

  const setIsLoaderUpdating = deckyState.setIsLoaderUpdating.bind(deckyState);
  const setVersionInfo = deckyState.setVersionInfo.bind(deckyState);
  const setActivePlugin = deckyState.setActivePlugin.bind(deckyState);
  const closeActivePlugin = deckyState.closeActivePlugin.bind(deckyState);
  const setPluginOrder = deckyState.setPluginOrder.bind(deckyState);
  const setDisabledPlugins = deckyState.setDisabledPlugins.bind(deckyState);

  return (
    <DeckyStateContext.Provider
      value={{
        ...publicDeckyState,
        setIsLoaderUpdating,
        setVersionInfo,
        setActivePlugin,
        closeActivePlugin,
        setPluginOrder,
        setDisabledPlugins
      }}
    >
      {children}
    </DeckyStateContext.Provider>
  );
};
