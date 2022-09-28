/**
 * @name ReactionMarketplace/shopOwnerByShopId
 * @method
 * @memberof Queries/ReactionMarketplace
 * @summary Returns the owner's account of a given shop
 * @param {Object} context - an object containing the per-request state
 * @param {Object} shopId - The shop ID for which to get the owner account
 * @returns {Promise<Object>} Account object Promise
 */
export default async function shopOwnerByShopId(context, shopId) {
  const { collections } = context;
  const { Groups } = collections;
  await context.validatePermissions("reaction:legacy:shops", "read", {
    shopId,
  });

  // console.log(shopId);

  const ownerGroupAndAccount = await Groups.aggregate([
    {
      $match: {
        shopId,
        slug: "owner",
      },
    },
    {
      // Find the users who are assigned to the owner group for each shop
      $lookup: {
        from: "Accounts",
        localField: "_id",
        foreignField: "groups",
        as: "account",
      },
    },
    {
      $unwind: {
        path: "$account",
      },
    },
  ]).toArray();

  if (ownerGroupAndAccount[0] && ownerGroupAndAccount[0].account) {
    // if (
    //   context.isInpersonated?.emails[0]?.address ===
    //   ownerGroupAndAccount[0].account.emails[0]?.address
    // ) {
    //   console.log(context.isInpersonated.name);
    //   ownerGroupAndAccount[0].account.impersonatedBy = context.impersonatedBy;
    // }
    const Impersonation = await context.queries.getImpersonationByUser(
      context,
      {
        id: ownerGroupAndAccount[0].account._id,
        isActive: true,
      }
    );

    ownerGroupAndAccount[0].account.Impersonation = Impersonation;
    return ownerGroupAndAccount[0].account;
  }

  return {};
}
