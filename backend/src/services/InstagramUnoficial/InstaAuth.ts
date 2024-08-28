import { IgApiClient } from 'instagram-private-api';
import { sample } from 'lodash';
import dotenv from 'dotenv';

dotenv.config();

const ig = new IgApiClient();

ig.state.generateDevice(process.env.IG_USERNAME);
ig.state.proxyUrl = process.env.IG_PROXY;

export async function likeRandomPost() {
  await ig.simulate.preLoginFlow();

  const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

  process.nextTick(async () => await ig.simulate.postLoginFlow());

  const userFeed = ig.feed.user(loggedInUser.pk);
  const myPostsFirstPage = await userFeed.items();
  const myPostsSecondPage = await userFeed.items();
  console.log("chegou na api do insta");

  await ig.media.like({
    mediaId: sample([myPostsFirstPage[1].id, myPostsSecondPage[1].id]),
    moduleInfo: {
      module_name: 'profile',
      user_id: loggedInUser.pk,
      username: loggedInUser.username, 
    },
    d: sample([0, 1]),
  });
}
