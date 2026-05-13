import { setUser, readConfig } from "./config"
import { CommandsRegistry, handlerAddFeed, handlerAgg, handlerGetFeeds, handlerListUsers, handlerLogin, handlerRegister, handlerReset, handlerFollow, handlerGetFollowing, handlerUnfollow, registerCommand, runCommand, handlerBrowse } from "./commands";
import { middlewareLoggedIn } from "./middleware";

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerListUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, 'feeds', handlerGetFeeds);
  registerCommand(registry, 'follow', middlewareLoggedIn(handlerFollow));
  registerCommand(registry, 'following', middlewareLoggedIn(handlerGetFollowing));
  registerCommand(registry, 'unfollow', middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry, 'browse', middlewareLoggedIn(handlerBrowse));

  const args = process.argv.slice(2);

  if (args.length == 0) {
    console.error("Not enough arguments were provided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
