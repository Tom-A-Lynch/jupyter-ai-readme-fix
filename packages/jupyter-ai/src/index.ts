import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import {
  IWidgetTracker,
  ReactWidget,
  IThemeManager
} from '@jupyterlab/apputils';
import { IDocumentWidget } from '@jupyterlab/docregistry';
import { IGlobalAwareness } from '@jupyter/collaboration';
import type { Awareness } from 'y-protocols/awareness';
import { buildChatSidebar } from './widgets/chat-sidebar';
import { SelectionWatcher } from './selection-watcher';
import { ChatHandler } from './chat_handler';
import { buildErrorWidget } from './widgets/chat-error';
import { completionPlugin } from './completions';
import { statusItemPlugin } from './status';

export type DocumentTracker = IWidgetTracker<IDocumentWidget>;

/**
 * Initialization data for the jupyter_ai extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter_ai:plugin',
  autoStart: true,
  optional: [IGlobalAwareness, ILayoutRestorer, IThemeManager],
  activate: async (
    app: JupyterFrontEnd,
    globalAwareness: Awareness | null,
    restorer: ILayoutRestorer | null,
    themeManager: IThemeManager | null
  ) => {
    /**
     * Initialize selection watcher singleton
     */
    const selectionWatcher = new SelectionWatcher(app.shell);

    /**
     * Initialize chat handler, open WS connection
     */
    const chatHandler = new ChatHandler();

    let chatWidget: ReactWidget | null = null;
    try {
      await chatHandler.initialize();
      chatWidget = buildChatSidebar(
        selectionWatcher,
        chatHandler,
        globalAwareness,
        themeManager
      );
    } catch (e) {
      chatWidget = buildErrorWidget(themeManager);
    }

    /**
     * Add Chat widget to right sidebar
     */
    app.shell.add(chatWidget, 'left', { rank: 2000 });

    if (restorer) {
      restorer.add(chatWidget, 'jupyter-ai-chat');
    }
  }
};

export default [plugin, statusItemPlugin, completionPlugin];
