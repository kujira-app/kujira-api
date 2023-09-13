import { PrismaClient } from "@prisma/client";
import { Response } from "express";

import * as Constants from "@/constants";
import * as Helpers from "@/helpers";
import * as Validators from "@/validators";

const prisma = new PrismaClient();

export async function fetchEntries(response: Response) {
  try {
    const entries = await prisma.entry.findMany({ orderBy: { id: "asc" } });

    return response.status(Constants.HttpStatusCodes.OK).json(
      Helpers.generateResponse({
        body: "Fetched entries!",
        response: entries,
      })
    );
  } catch (error) {
    console.error(error);
    return response
      .status(Constants.HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        Helpers.generateErrorResponse({
          body: "There was an error fetching entries. Please refresh the page.",
        })
      );
  }
}

export async function fetchEntry(response: Response, entryId: number) {
  try {
    const entry = await prisma.entry.findUniqueOrThrow({
      where: { id: entryId },
    });

    return response
      .status(Constants.HttpStatusCodes.OK)
      .json(
        Helpers.generateResponse({ body: "Fetched entry!", response: entry })
      );
  } catch (error) {
    console.error(error);
    return response.status(Constants.HttpStatusCodes.NOT_FOUND).json(
      Helpers.generateErrorResponse({
        body: Constants.Errors.ENTRY_DOES_NOT_EXIST,
      })
    );
  }
}

export async function fetchOverviewEntries(
  response: Response,
  overviewId: number
) {
  try {
    const overviewEntries = await prisma.entry.findMany({
      where: { overviewId },
      include: {
        purchases: {
          select: { id: true },
          orderBy: { placement: "asc" },
        },
      },
    });

    return response.status(Constants.HttpStatusCodes.OK).json(
      Helpers.generateResponse({
        body: "Fetched overview entries!",
        response: overviewEntries,
      })
    );
  } catch (error) {
    console.error(error);
    return response
      .status(Constants.HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        Helpers.generateErrorResponse({
          body: "There was an error fetching entries. Please refresh the page.",
        })
      );
  }
}

export async function fetchLogbookEntries(
  response: Response,
  logbookId: number
) {
  try {
    const logbookEntries = await prisma.entry.findMany({
      where: { logbookId },
      include: {
        purchases: {
          select: { id: true },
          orderBy: { placement: "asc" },
        },
      },
    });

    return response.status(Constants.HttpStatusCodes.OK).json(
      Helpers.generateResponse({
        body: "Fetched logbook entries!",
        response: logbookEntries,
      })
    );
  } catch (error) {
    console.error(error);
    return response
      .status(Constants.HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        Helpers.generateErrorResponse({
          body: "There was an error fetching entries. Please refresh the page.",
        })
      );
  }
}

async function checkExistingEntry(
  response: Response,
  name: string,
  overviewId?: number | null,
  logbookId?: number | null
) {
  try {
    let entry = null;

    if (overviewId) {
      entry = await prisma.entry.findFirst({ where: { name, overviewId } });
    } else if (logbookId) {
      entry = await prisma.entry.findFirst({ where: { name, logbookId } });
    }

    return !!entry;
  } catch (error) {
    console.error(error);
    return response.status(Constants.HttpStatusCodes.BAD_REQUEST).json(
      Helpers.generateErrorResponse({
        body: "Failed to check for an existing entry during entry creation.",
      })
    );
  }
}

export async function createEntry(
  response: Response,
  name: string,
  overviewId?: number | null,
  logbookId?: number | null
) {
  try {
    const entryAlreadyExists = await checkExistingEntry(
      response,
      name,
      overviewId,
      logbookId
    );

    if (entryAlreadyExists) {
      throw new Error();
    } else {
      const data: Validators.RequiredEntryCreateValidator &
        Validators.OptionalEntryCreateValidator = {
        name,
        overviewId,
        logbookId,
      };

      const entry = await prisma.entry.create({
        data,
        include: {
          purchases: {
            select: { id: true },
            orderBy: { placement: "asc" },
          },
        },
      });

      await prisma.purchase.create({
        data: { entryId: entry.id },
      });

      return response
        .status(Constants.HttpStatusCodes.CREATED)
        .json(
          Helpers.generateResponse({ body: "Created entry!", response: entry })
        );
    }
  } catch (error) {
    console.error(error);
    return response.status(Constants.HttpStatusCodes.BAD_REQUEST).json(
      Helpers.generateErrorResponse({
        body: `An entry with name "${name}" already exists!`,
      })
    );
  }
}

export async function updateEntry(
  response: Response,
  entryId: number,
  name?: string,
  totalSpent?: number,
  budget?: number | null,
  overviewId?: number | null,
  logbookId?: number | null
) {
  try {
    if (name) {
      const entryAlreadyExists = await checkExistingEntry(
        response,
        name,
        overviewId,
        logbookId
      );
      if (entryAlreadyExists) throw new Error();
    }

    // ↓↓↓ This part won't execute if the entry's name is updated to one that already exists. ↓↓↓ //
    const data: Validators.EntryUpdateValidator = {
      name,
      totalSpent,
      budget,
      overviewId,
      logbookId,
    };

    const entry = await prisma.entry.update({
      data,
      where: { id: entryId },
      include: {
        purchases: {
          select: { id: true },
          orderBy: { placement: "asc" },
        },
      },
    });

    return response.status(Constants.HttpStatusCodes.OK).json(
      Helpers.generateResponse({
        body: "Updated entry!",
        response: entry,
      })
    );
  } catch (error) {
    console.error(error);
    return response.status(Constants.HttpStatusCodes.NOT_FOUND).json({
      body: `An entry with the name ${name} already exists.`,
    });
  }
}

export async function deleteEntry(response: Response, entryId: number) {
  try {
    await prisma.entry.delete({ where: { id: entryId } });

    return response
      .status(Constants.HttpStatusCodes.OK)
      .json(
        Helpers.generateResponse({ body: "Deleted entry!", response: entryId })
      );
  } catch (error) {
    console.error(error);
    return response.status(Constants.HttpStatusCodes.NOT_FOUND).json(
      Helpers.generateErrorResponse({
        body: Constants.Errors.ENTRY_DOES_NOT_EXIST,
      })
    );
  }
}
