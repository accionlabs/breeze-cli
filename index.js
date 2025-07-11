#!/usr/bin/env node

import { Command } from 'commander';
import init from './commands/config_init.js';
import config_commands from './commands/config_commands.js';
import list_commands from './commands/list_commands.js';
import generate_commands from './commands/generate_commands.js';
import import_command from './commands/import_command.js';
import qa_command from './commands/qa_commands.js'

const program = new Command();

program
  .name('breeze')
  .description('Task Manager for Breeze - Accionlabs')
  .version('1.0.0');

program
  .command('init')
  .description('Run interactive project setup')
  .action(init);

program.addCommand(config_commands)

program.addCommand(list_commands);

program.addCommand(generate_commands);

program.addCommand(import_command);

program.addCommand(qa_command);

program.parse();